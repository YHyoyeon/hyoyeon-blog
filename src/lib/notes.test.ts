import { test, expect } from "bun:test";
import { notes } from "@/lib/notes";
import { noteContent } from "@/content/notes";
import type { NoteBody } from "@/lib/note-content";

/**
 * 글은 두 곳에 따로 등록된다(`content/notes/index.ts`의 본문, `lib/notes.ts`의 메타).
 * 타입은 둘의 일치도, ko/en 구조의 일치도 잡아주지 않는다 — 어긋나면 런타임에
 * 빈 페이지나 반쪽 페이지로만 드러나므로 여기서 막는다.
 */

test("본문과 메타가 같은 slug 집합을 갖는다", () => {
  expect(Object.keys(noteContent).sort()).toEqual(notes.map((n) => n.slug).sort());
});

test("slug가 중복되지 않는다", () => {
  expect(new Set(notes.map((n) => n.slug)).size).toBe(notes.length);
});

test("date가 YYYY-MM-DD 형식의 실재하는 날짜다", () => {
  for (const note of notes) {
    expect({ slug: note.slug, valid: /^\d{4}-\d{2}-\d{2}$/.test(note.date) }).toEqual({
      slug: note.slug,
      valid: true,
    });
    expect({ slug: note.slug, nan: Number.isNaN(Date.parse(note.date)) }).toEqual({
      slug: note.slug,
      nan: false,
    });
  }
});

test("목록이 최신순으로 정렬돼 있다", () => {
  const dates = notes.map((n) => n.date);
  expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)));
});

/** 섹션 라벨과 블록 종류를 이어 붙인 구조 지문. ko/en이 같아야 한다. */
const shapeOf = (body: NoteBody) =>
  body.sections.map((section) => section.blocks.map((block) => block.kind).join("+"));

test("ko/en의 섹션 수와 블록 구조가 같다", () => {
  for (const { slug } of notes) {
    const content = noteContent[slug];
    // slug를 함께 비교해야 실패 메시지에서 어느 글인지 바로 보인다.
    expect({ slug, shape: shapeOf(content.en) }).toEqual({ slug, shape: shapeOf(content.ko) });
  }
});

test("intro·label·title이 비어 있지 않다", () => {
  for (const { slug } of notes) {
    for (const lang of ["ko", "en"] as const) {
      const body = noteContent[slug][lang];
      expect({ slug, lang, ok: body.intro.trim().length > 0 }).toEqual({ slug, lang, ok: true });
      for (const section of body.sections) {
        expect({
          slug,
          lang,
          ok: section.label.trim().length > 0 && section.title.trim().length > 0,
        }).toEqual({ slug, lang, ok: true });
      }
    }
  }
});
