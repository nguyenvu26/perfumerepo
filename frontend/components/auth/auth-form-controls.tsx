"use client";

import { useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";

import { Link } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type AuthInputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  endAdornment?: ReactNode;
  icon: LucideIcon;
  label: string;
  labelAction?: ReactNode;
  wrapperClassName?: string;
};

export function AuthInputField({
  className,
  endAdornment,
  icon: Icon,
  label,
  labelAction,
  wrapperClassName,
  ...props
}: AuthInputFieldProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="pl-1 text-[12px] font-medium text-[#F5F5F5]/78">
          {label}
        </label>
        {labelAction}
      </div>

      <div
        className={cn(
          "group flex h-14 items-center rounded-full border border-white/10 bg-[#181B20] px-5 transition-all focus-within:border-[#C8A96A]/45 focus-within:shadow-[0_0_0_3px_rgba(200,169,106,0.10)]",
          wrapperClassName,
        )}
      >
        <Icon className="h-4 w-4 shrink-0 text-[#C8A96A]/65 transition-colors group-focus-within:text-[#C8A96A]" />
        <input
          className={cn(
            "auth-input-element h-full flex-1 bg-transparent px-3 text-[15px] text-[#F5F5F5] outline-none placeholder:text-[#9CA3AF]/65",
            className,
          )}
          {...props}
        />
        {endAdornment}
      </div>
    </div>
  );
}

type AuthPasswordFieldProps = Omit<AuthInputFieldProps, "endAdornment" | "type">;

export function AuthPasswordField(props: AuthPasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <AuthInputField
      {...props}
      type={isVisible ? "text" : "password"}
      endAdornment={
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#9CA3AF] transition-colors hover:text-[#F5F5F5]"
          aria-label={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
    />
  );
}

export function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div className="relative my-8">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/8" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[#101113] px-4 text-[12px] text-[#9CA3AF]">
          {children}
        </span>
      </div>
    </div>
  );
}

type SocialAuthButtonProps = {
  disabled?: boolean;
  label: string;
  onClick: () => void;
};

export function SocialAuthButton({
  disabled,
  label,
  onClick,
}: SocialAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-transparent px-5 text-sm font-medium text-[#F5F5F5] transition-all hover:border-[#C8A96A]/35 hover:bg-white/[0.02] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <GoogleMark />
      <span>{label}</span>
    </button>
  );
}

type AuthFooterLinkProps = {
  href: string;
  linkLabel: string;
  prompt: string;
};

export function AuthFooterLink({
  href,
  linkLabel,
  prompt,
}: AuthFooterLinkProps) {
  return (
    <p className="mt-10 text-center text-sm text-[#9CA3AF]">
      {prompt}{" "}
      <Link
        href={href}
        className="font-medium text-[#C8A96A] transition-colors hover:text-[#E2C793]"
      >
        {linkLabel}
      </Link>
    </p>
  );
}

function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
