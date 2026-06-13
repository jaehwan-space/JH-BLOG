"use client";

export function ConfirmSubmitButton({
  children,
  message,
  className = "button button-danger",
  formId
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
  formId?: string;
}) {
  return (
    <button
      className={className}
      form={formId}
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
