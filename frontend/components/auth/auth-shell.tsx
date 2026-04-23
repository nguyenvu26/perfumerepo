import type { ReactNode } from "react";
import Image from "next/image";

const EDITORIAL_SERIF = {
  fontFamily: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
} as const;

type AuthShellProps = {
  children: ReactNode;
  formEyebrow?: string;
  formSubtitle: string;
  formTitle: string;
  visualAlt: string;
  visualImage: string;
  visualSubtitle?: string;
  visualTitle: string;
};

export function AuthShell({
  children,
  formEyebrow,
  formSubtitle,
  formTitle,
  visualAlt,
  visualImage,
  visualSubtitle,
  visualTitle,
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080809] text-[#F5F5F5]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(200,169,106,0.16),transparent_68%)] blur-3xl" />
        <div className="absolute left-[-8rem] top-[-7rem] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-8rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(200,169,106,0.10),transparent_72%)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] items-center justify-center px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-[1240px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#101113] shadow-[0_45px_120px_-60px_rgba(0,0,0,0.88)] lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative min-h-[290px] sm:min-h-[360px] lg:min-h-[780px]">
            <Image
              src={visualImage}
              alt={visualAlt}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 58vw"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,0.04),rgba(8,8,10,0.18)_45%,rgba(8,8,10,0.84)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,11,12,0.22),rgba(11,11,12,0.08),transparent)]" />
            <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10 lg:p-12">
              <div className="max-w-md space-y-3">
                <h2
                  className="text-[clamp(2.25rem,3vw,4.4rem)] leading-[0.92] tracking-[-0.03em] text-[#F5EFE4]"
                  style={{ ...EDITORIAL_SERIF, fontStyle: "italic" }}
                >
                  {visualTitle}
                </h2>
                {visualSubtitle ? (
                  <p className="max-w-sm text-sm leading-6 text-[#EFE8DA]/72 sm:text-[15px] sm:leading-7">
                    {visualSubtitle}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="relative bg-[linear-gradient(180deg,rgba(19,20,24,0.98),rgba(14,15,18,0.99))] px-6 py-8 sm:px-10 sm:py-10 lg:px-16 lg:py-16">
            <div className="mx-auto flex h-full w-full max-w-[430px] flex-col justify-center">
              <div className="mb-8 space-y-4 sm:mb-10">
                {formEyebrow ? (
                  <span className="inline-flex w-fit items-center rounded-full border border-[#C8A96A]/20 bg-[#C8A96A]/8 px-4 py-1.5 text-[11px] font-medium text-[#C8A96A]">
                    {formEyebrow}
                  </span>
                ) : null}
                <div className="space-y-3">
                  <h1
                    className="text-[clamp(2rem,2.2vw,3.15rem)] leading-[0.98] tracking-[-0.03em] text-[#F5F5F5]"
                    style={EDITORIAL_SERIF}
                  >
                    {formTitle}
                  </h1>
                  {formSubtitle ? (
                    <p className="max-w-sm text-sm leading-6 text-[#9CA3AF] sm:text-[15px]">
                      {formSubtitle}
                    </p>
                  ) : null}
                </div>
              </div>

              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
