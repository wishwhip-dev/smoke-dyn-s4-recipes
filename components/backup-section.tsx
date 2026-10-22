"use client";

/**
 * The way the box moves: export the whole recipe box to a file, or load a backup back in. Live in
 * the storage package (`useDatabaseTransfer`); this just gives it a labelled control each.
 *
 * Loading a backup merges — it adds or updates matching recipes and never clears what is here —
 * so there is no destructive path on this screen to confirm.
 */
import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { database } from "@/lib/db";
import { useDatabaseTransfer } from "@/lib/storage/react";

export function BackupSection() {
  const { state, exportToFile, importFromFile } = useDatabaseTransfer(database);
  const fileInput = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    await importFromFile(file, "merge");
    setImporting(false);
    // So picking the same file again still fires onChange.
    if (fileInput.current) fileInput.current.value = "";
  };

  const message =
    state.kind === "working" || importing
      ? "Working…"
      : state.kind === "imported"
        ? `Loaded ${state.result.rows} ${state.result.rows === 1 ? "recipe" : "recipes"} from the backup.`
        : state.kind === "error"
          ? state.message
          : "Save the whole box to a file, or bring a backup back.";

  return (
    <Card className="border-dashed bg-muted/40">
      <CardHeader className="gap-1">
        <CardTitle className="text-base">Backup</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" onClick={() => void exportToFile()} disabled={state.kind === "working"}>
          <Download className="h-4 w-4" aria-hidden /> Export a backup
        </Button>
        <div className="contents">
          <input
            ref={fileInput}
            id="backup-file"
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <Label
            htmlFor="backup-file"
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground"
          >
            <Upload className="h-4 w-4" aria-hidden /> Load a backup
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}
