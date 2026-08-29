import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { renderMarkdown } from "@/lib/markdown";
import { Button, Textarea } from "./ui";

interface Project {
  id: string;
  name: string;
  description: string;
  tagline: string;
  websiteUrl: string;
  logoUrl: string;
  screenshotUrl?: string;
  founderName: string;
  category: string;
  status: string;
  lookingFor: string;
  plan: string;
  createdAt: string;
  ownerId?: string;
}

interface ProjectSidebarProps {
  project: Project | null;
  onClose: () => void;
}

type FeedbackState = "idle" | "sending" | "success" | "error";

const FALLBACK_LOGO =
  "https://images.pexels.com/photos/7130560/pexels-photo-7130560.jpeg?auto=compress&cs=tinysrgb&w=240";

const parseScreenshots = (value?: string): string[] => {
  if (!value?.trim()) return [];

  try {
    const parsed = value.trim().startsWith("[") ? JSON.parse(value) : [value];

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
  } catch {
    return [value].filter(Boolean);
  }
};

const getWebsiteUrl = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) return null;

  return /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;
};

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  project,
  onClose,
}) => {
  const [feedback, setFeedback] = useState("");
  const [feedbackState, setFeedbackState] =
    useState<FeedbackState>("idle");
  const [feedbackError, setFeedbackError] = useState("");
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const isOwner = currentUserId === project?.ownerId;

  const screenshots = useMemo(
    () => parseScreenshots(project?.screenshotUrl),
    [project?.screenshotUrl],
  );

  const formattedDate = useMemo(() => {
    if (!project?.createdAt) return "";

    const date = new Date(project.createdAt);

    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  }, [project?.createdAt]);

  const descriptionHtml = useMemo(
    () => (project?.description ? renderMarkdown(project.description) : ""),
    [project?.description],
  );

  useEffect(() => {
    if (!project) return;

    setIsFlashActive(true);
    setCurrentSlide(0);
    setFeedback("");
    setFeedbackState("idle");
    setFeedbackError("");
    setShowFeedbackForm(false);
    setHasSubmitted(false);

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setCurrentUserId(data.userId);
          return fetch(`/api/messages?userId=${data.userId}`);
        }
        return null;
      })
      .then((res) => {
        if (res) return res.json();
      })
      .then((data) => {
        if (data?.success && data.conversations) {
          const alreadyHas = data.conversations.some((c: any) => c.projectId === project.id);
          setHasSubmitted(alreadyHas);
        }
      })
      .catch(() => {});

    const timer = window.setTimeout(() => setIsFlashActive(false), 1200);

    return () => window.clearTimeout(timer);
  }, [project?.id]);

  useEffect(() => {
    if (!project) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showFeedbackForm) {
          setShowFeedbackForm(false);
        } else {
          onClose();
        }
      }

      if (screenshots.length > 1 && event.key === "ArrowRight") {
        setCurrentSlide((slide) => (slide + 1) % screenshots.length);
      }

      if (screenshots.length > 1 && event.key === "ArrowLeft") {
        setCurrentSlide(
          (slide) => (slide - 1 + screenshots.length) % screenshots.length,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, project, screenshots.length, showFeedbackForm]);

  if (!project) return null;

  const websiteUrl = getWebsiteUrl(project.websiteUrl);
  const feedbackLength = feedback.trim().length;
  const canSubmitFeedback =
    feedbackLength > 0 && feedbackState !== "sending";

  const nextSlide = () => {
    if (screenshots.length < 2) return;
    setCurrentSlide((slide) => (slide + 1) % screenshots.length);
  };

  const previousSlide = () => {
    if (screenshots.length < 2) return;
    setCurrentSlide(
      (slide) => (slide - 1 + screenshots.length) % screenshots.length,
    );
  };

  const handleSendFeedback = async (event: React.FormEvent) => {
    event.preventDefault();

    const message = feedback.trim();

    if (!message || feedbackState === "sending") return;

    if (!currentUserId) {
      window.location.assign("/login");
      return;
    }

    setFeedbackState("sending");
    setFeedbackError("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          senderId: currentUserId,
          content: message,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "We could not send your feedback.");
      }

      setFeedback("");
      setFeedbackState("success");

      window.setTimeout(() => {
        setFeedbackState("idle");
        setShowFeedbackForm(false);
      }, 2200);
    } catch (error) {
      setFeedbackState("error");
      setFeedbackError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  return (
    <aside
      aria-label={`${project.name} project details`}
      className={[
        "relative flex h-full w-full flex-col overflow-hidden",
        "bg-background/95 text-foreground shadow-xl shadow-black/5",
        "supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur-xl",
        "transition-[border-color,box-shadow,background-color] duration-700 ease-out",
        isFlashActive
          ? "border-primary-500/60 bg-primary-500/[0.04] shadow-primary-500/15 ring-1 ring-primary-500/20"
          : "border-border-custom",
      ].join(" ")}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary-500/[0.08] to-transparent"
      />

      <header className="relative flex items-center justify-between border-b border-border-custom px-5 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="-ml-2 min-h-10 gap-2 px-2 text-xs font-semibold text-zinc-600 hover:bg-primary-500/10 hover:text-primary-600 dark:text-zinc-400 dark:hover:text-primary-400"
          aria-label="Back to board information"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Board info
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-9 w-9 rounded-full text-zinc-500 hover:bg-zinc-500/10 hover:text-foreground"
          aria-label="Close project details"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </header>

      <div className="relative flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-6 px-5 py-6">
          <section aria-labelledby="project-title">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div
                  aria-hidden="true"
                  className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary-500/30 via-violet-500/15 to-cyan-500/20 blur-sm"
                />
                <img
                  src={project.logoUrl || FALLBACK_LOGO}
                  alt={`${project.name} logo`}
                  className="relative h-16 w-16 rounded-2xl border border-white/60 bg-card object-cover shadow-md dark:border-white/10"
                  onError={(event) => {
                    event.currentTarget.src = FALLBACK_LOGO;
                  }}
                />
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="truncate text-xs font-bold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-400">
                    {project.category}
                  </span>
                  <Sparkles
                    className="h-3.5 w-3.5 shrink-0 text-amber-500"
                    aria-hidden="true"
                  />
                </div>

                <h2
                  id="project-title"
                  className="break-words text-2xl font-bold tracking-tight text-foreground"
                >
                  {project.name}
                </h2>

                {project.tagline && (
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {project.tagline}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <StatusBadge status={project.status} />
              <span className="inline-flex min-h-7 items-center rounded-full border border-border-custom bg-card/80 px-3 text-xs text-zinc-600 shadow-sm dark:text-zinc-300">
                Seeking
                <strong className="ml-1.5 capitalize text-primary-600 dark:text-primary-400">
                  {project.lookingFor}
                </strong>
              </span>
            </div>
          </section>

          {screenshots.length > 0 && (
            <section
              aria-label={`${project.name} screenshots`}
              className="group relative"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border-custom bg-zinc-950 shadow-lg shadow-black/10">
                <img
                  key={screenshots[currentSlide]}
                  src={screenshots[currentSlide]}
                  alt={`${project.name} preview ${currentSlide + 1} of ${screenshots.length}`}
                  className="h-full w-full animate-in object-cover duration-300 fade-in"
                />

                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10"
                />

                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                    {currentSlide + 1} / {screenshots.length}
                  </span>

                  {screenshots.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={previousSlide}
                        className="h-9 w-9 rounded-full border border-white/15 bg-black/45 text-white backdrop-blur-md hover:bg-black/70 hover:text-white"
                        aria-label="Show previous screenshot"
                      >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={nextSlide}
                        className="h-9 w-9 rounded-full border border-white/15 bg-black/45 text-white backdrop-blur-md hover:bg-black/70 hover:text-white"
                        aria-label="Show next screenshot"
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {screenshots.length > 1 && (
                <div
                  className="mt-3 flex justify-center gap-1.5"
                  role="tablist"
                  aria-label="Select screenshot"
                >
                  {screenshots.map((screenshot, index) => (
                    <button
                      key={`${screenshot}-${index}`}
                      type="button"
                      role="tab"
                      aria-selected={currentSlide === index}
                      aria-label={`Show screenshot ${index + 1}`}
                      onClick={() => setCurrentSlide(index)}
                      className={[
                        "h-1.5 rounded-full transition-all duration-300",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                        currentSlide === index
                          ? "w-7 bg-primary-500"
                          : "w-1.5 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600",
                      ].join(" ")}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          <section aria-labelledby="about-project">
            <h3
              id="about-project"
              className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500"
            >
              About the project
            </h3>
            <div
              className="mt-3 text-sm leading-7 text-zinc-700 prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary-600 dark:text-zinc-300 dark:prose-a:text-primary-400"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          </section>

          <section
            aria-label="Project information"
            className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border-custom bg-card/60 shadow-sm"
          >
            <div className="border-b border-r border-border-custom p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                Founder
              </p>
              <p className="mt-1.5 truncate text-sm font-semibold text-foreground">
                {project.founderName}
              </p>
            </div>

            <div className="border-b border-border-custom p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                Placement
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold capitalize text-amber-600 dark:text-amber-400">
                <Award className="h-4 w-4" aria-hidden="true" />
                {project.plan} spot
              </p>
            </div>

            {formattedDate && (
              <div className="col-span-2 flex items-center gap-2 p-4 text-xs text-zinc-500">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                <span>
                  Added <time dateTime={project.createdAt}>{formattedDate}</time>
                </span>
              </div>
            )}
          </section>

          {showFeedbackForm && (
            <section
              aria-labelledby="feedback-title"
              className="animate-in rounded-2xl border border-primary-500/20 bg-primary-500/[0.04] p-4 duration-200 fade-in slide-in-from-bottom-2"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3
                    id="feedback-title"
                    className="text-sm font-bold text-foreground"
                  >
                    Share thoughtful feedback
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    Your message goes directly to {project.founderName}.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFeedbackForm(false)}
                  className="-mr-2 -mt-2 h-9 w-9 shrink-0 rounded-full"
                  aria-label="Close feedback form"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>

              {feedbackState === "success" ? (
                <div
                  role="status"
                  className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                    <Check className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    Feedback sent successfully
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendFeedback} className="space-y-3">
                  <div>
                    <Textarea
                      value={feedback}
                      onChange={(event) => {
                        setFeedback(event.target.value);
                        if (feedbackState === "error") {
                          setFeedbackState("idle");
                          setFeedbackError("");
                        }
                      }}
                      placeholder="What works well? What could make this project even stronger?"
                      rows={4}
                      maxLength={1000}
                      required
                      autoFocus
                      aria-label={`Feedback for ${project.name}`}
                      aria-describedby={
                        feedbackState === "error"
                          ? "feedback-error feedback-count"
                          : "feedback-count"
                      }
                      className="min-h-28 resize-none bg-background/80"
                    />
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <p
                        id="feedback-error"
                        role="alert"
                        className="text-xs text-rose-600 dark:text-rose-400"
                      >
                        {feedbackState === "error" ? feedbackError : ""}
                      </p>
                      <span
                        id="feedback-count"
                        className="shrink-0 text-[11px] tabular-nums text-zinc-500"
                      >
                        {feedback.length}/1000
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={!canSubmitFeedback}
                    className="w-full gap-2"
                  >
                    {feedbackState === "sending" ? (
                      <>
                        <Loader2
                          className="h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" aria-hidden="true" />
                        Send feedback
                      </>
                    )}
                  </Button>
                </form>
              )}
            </section>
          )}
        </div>
      </div>

      <footer className="relative border-t border-border-custom bg-background/90 p-4 backdrop-blur-xl">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {!isOwner && (
            <Button
              type="button"
              disabled={hasSubmitted}
              onClick={() => setShowFeedbackForm((visible) => !visible)}
              variant="outline"
              className="min-h-11 gap-2"
              aria-expanded={showFeedbackForm}
              aria-controls="feedback-title"
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              {hasSubmitted ? "Feedback submitted" : "Give feedback"}
            </Button>
          )}

          <Button
            type="button"
            disabled={!websiteUrl}
            onClick={() => {
              if (websiteUrl) {
                window.open(websiteUrl, "_blank", "noopener,noreferrer");
              }
            }}
            className={`min-h-11 text-[12.5px] gap-2 shadow-md shadow-primary-500/15 ${isOwner ? 'col-span-2' : ''}`}
          >
            Visit website
          </Button>
        </div>
      </footer>
    </aside>
  );
};
