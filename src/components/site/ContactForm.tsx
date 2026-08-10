"use client";

import { useState } from "react";
import { Send, Check } from "lucide-react";
import { dict, type Lang } from "@/lib/i18n";

type Status = "idle" | "sending" | "sent" | "error";

const field =
  "w-full rounded-xl bg-background px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-2 focus:outline-offset-2 focus:outline-ring";

export default function ContactForm({ lang }: { lang: Lang }) {
  const t = dict[lang];
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setStatus("sent");
        form.reset();
        return;
      }
      const { error: code } = (await response.json().catch(() => ({}))) as { error?: string };
      setError(
        code === "invalid" ? t.formInvalid : code === "rate_limited" ? t.formRateLimited : t.formError,
      );
      setStatus("error");
    } catch {
      setError(t.formError);
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="mt-5 inline-flex items-center gap-2 text-[15px] font-semibold text-accent">
        <Check size={18} />
        {t.formSent}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-2.5">
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <input name="name" required maxLength={80} placeholder={t.formName} className={field} />
        <input
          name="email"
          type="email"
          required
          maxLength={160}
          placeholder={t.formEmail}
          className={field}
        />
      </div>
      <textarea
        name="message"
        required
        minLength={10}
        maxLength={4000}
        rows={4}
        placeholder={t.formMessage}
        className={`${field} resize-y`}
      />
      {/* 허니팟. 사람에게는 보이지 않고 봇만 채운다. aria-hidden + tabIndex로 스크린리더·키보드에서도 제외. */}
      <input
        name="nickname"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />
      <div className="mt-1 flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Send size={16} />
          {status === "sending" ? t.formSending : t.formSubmit}
        </button>
        {error && <p className="text-sm text-destructive break-keep">{error}</p>}
      </div>
    </form>
  );
}
