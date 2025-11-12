"use client";

import { useCallback, useMemo, useState } from "react";

type ExcelLoaderPanelProps = {
  className?: string;
};

type UploadStage = "idle" | "processing" | "ready" | "sent";

type TrackedFile = {
  file: File;
  createdAt: Date;
};

const ACCEPTED_FILE_EXTENSIONS = [".xlsx", ".xls", ".csv"];

const ACCEPTED_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
]);

export function ExcelLoaderPanel({ className }: ExcelLoaderPanelProps) {
  const [trackedFile, setTrackedFile] = useState<TrackedFile | null>(null);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);

  const hasFile = Boolean(trackedFile?.file);

  const summary = useMemo(() => {
    if (!trackedFile) {
      return null;
    }

    const { file } = trackedFile;
    return [
      { label: "File name", value: file.name },
      { label: "Uploaded", value: trackedFile.createdAt.toLocaleTimeString() },
      { label: "Size", value: formatBytes(file.size) },
      {
        label: "Type",
        value: file.type || guessTypeFromExtension(file.name) || "Unknown",
      },
    ];
  }, [trackedFile]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    const file = files[0];

    setError(null);
    setNotes([]);
    setStage("idle");

    if (!isAcceptedFileType(file)) {
      setError("Please upload an .xlsx, .xls, or .csv file.");
      return;
    }

    setStage("processing");

    // Simulate async analysis so we can show state transitions.
    await new Promise((resolve) => {
      window.setTimeout(resolve, 300);
    });

    setTrackedFile({
      file,
      createdAt: new Date(),
    });
    setNotes(buildInitialNotes(file));
    setStage("ready");
  }, []);

  const handleFileInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      await handleFiles(event.target.files);
      event.target.value = "";
    },
    [handleFiles]
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      await handleFiles(event.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleReset = useCallback(() => {
    setTrackedFile(null);
    setNotes([]);
    setStage("idle");
    setError(null);
  }, []);

  const handleSendToAssistant = useCallback(() => {
    if (!trackedFile) {
      return;
    }
    setStage("sent");
    setNotes((current) => [
      ...current,
      "Ready to share with the assistant — attach the spreadsheet using the paperclip inside the chat when you're ready to analyze it.",
    ]);
  }, [trackedFile]);

  const baseClass =
    "flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900";

  return (
    <section
      aria-label="Workbook loader"
      className={[baseClass, className].filter(Boolean).join(" ")}
    >
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Workbook loader
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Upload a spreadsheet to prime the assistant with the context it
            needs.
          </p>
        </div>
        {hasFile ? (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {stage === "sent"
              ? "Sent to assistant"
              : stage === "ready"
              ? "Ready"
              : "Processing"}
          </span>
        ) : null}
      </header>

      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={[
          "relative flex flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed",
          "border-slate-200 bg-slate-50/70 p-6 text-center transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800",
          hasFile ? "border-dashed border-emerald-400" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <input
          type="file"
          accept={ACCEPTED_FILE_EXTENSIONS.join(",")}
          onChange={handleFileInputChange}
          className="sr-only"
        />
        {!hasFile ? (
          <div className="flex flex-col items-center gap-3">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-slate-200 text-2xl text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              📊
            </div>
            <div>
              <p className="text-base font-medium text-slate-700 dark:text-slate-100">
                Drag & drop your workbook
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Supports .xlsx, .xls and .csv files up to 25&nbsp;MB.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Browse files
            </button>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              ✓
            </div>
            <div className="w-full rounded-xl bg-white/80 p-4 text-left shadow-inner dark:bg-slate-900/90">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {trackedFile?.file.name}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {formatBytes(trackedFile?.file.size ?? 0)}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleSendToAssistant}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
              >
                Mark as ready for chat
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-200"
              >
                Replace file
              </button>
            </div>
          </div>
        )}
      </label>

      <div className="mt-6 space-y-4 text-sm">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-900/40 dark:text-red-200">
            {error}
          </div>
        ) : null}

        {summary ? (
          <dl className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/70 sm:grid-cols-2">
            {summary.map((item) => (
              <div key={item.label} className="space-y-1">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {item.label}
                </dt>
                <dd className="text-sm text-slate-700 dark:text-slate-200">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Copilot workflow checklist
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-600 dark:text-slate-300">
            <li>Upload the most relevant workbook for the analysis.</li>
            <li>Click “Mark as ready for chat” once the file is finalized.</li>
            <li>
              Use the paperclip within the chat to share the spreadsheet with
              the assistant.
            </li>
            <li>
              Ask follow-up questions like “summarize the revenue trends” or
              “what are the outliers?” on the right-hand pane.
            </li>
          </ul>
        </section>

        {notes.length > 0 ? (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">
            <h3 className="text-sm font-semibold">Notes</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {notes.map((item, index) => (
                <li key={`${item}-${index}`}>• {item}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </section>
  );
}

function isAcceptedFileType(file: File): boolean {
  if (ACCEPTED_MIME_TYPES.has(file.type)) {
    return true;
  }

  const lower = file.name.toLowerCase();
  return ACCEPTED_FILE_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

function guessTypeFromExtension(name: string): string | null {
  const lowerName = name.toLowerCase();
  if (lowerName.endsWith(".xlsx")) {
    return "Excel workbook (.xlsx)";
  }
  if (lowerName.endsWith(".xls")) {
    return "Excel workbook (.xls)";
  }
  if (lowerName.endsWith(".csv")) {
    return "Comma separated values (.csv)";
  }
  return null;
}

function buildInitialNotes(file: File): string[] {
  const insights = [];
  if (file.size > 10 * 1024 * 1024) {
    insights.push("Large workbook detected — consider sharing summaries to speed up analysis.");
  }
  if (file.name.toLowerCase().includes("forecast")) {
    insights.push("Looks like a forecast — ask the assistant to review assumptions and variances.");
  }
  if (file.name.toLowerCase().includes("budget")) {
    insights.push("Budget workbook spotted — try comparing planned vs. actual figures.");
  }
  if (insights.length === 0) {
    insights.push("Workbook queued — the assistant can reference it once attached in chat.");
  }
  return insights;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

