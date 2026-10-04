"use client";

type Props = { action: () => Promise<void>; message: string; className?: string; children: React.ReactNode };

export function ConfirmSubmit({ action, message, className = "", children }: Props) {
  return (
    <form action={action} onSubmit={(e) => !confirm(message) && e.preventDefault()}>
      <button type="submit" className={`cursor-pointer ${className}`}>
        {children}
      </button>
    </form>
  );
}
