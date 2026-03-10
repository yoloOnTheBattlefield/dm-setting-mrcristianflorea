import { useState, useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useQueryClient } from "@tanstack/react-query";
import { throttle } from "@/lib/throttle";
import type { QualificationJob } from "@/hooks/useJobs";

interface FileProgress {
  processedRows: number;
  totalFilteredRows: number;
  qualifiedCount: number;
  failedRows: number;
}

interface JobProgressState {
  status: QualificationJob["status"] | null;
  fileProgresses: Map<number, FileProgress>;
  fileStatuses: Map<number, string>;
  totalQualified: number | null;
  totalFailed: number | null;
  error: string | null;
}

export function useJobProgress(jobId: string | null) {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const [progress, setProgress] = useState<JobProgressState>({
    status: null,
    fileProgresses: new Map(),
    fileStatuses: new Map(),
    totalQualified: null,
    totalFailed: null,
    error: null,
  });

  useEffect(() => {
    if (!socket || !jobId) return;

    const onStarted = (data: { jobId: string; status: string }) => {
      if (data.jobId !== jobId) return;
      setProgress((prev) => ({ ...prev, status: "running" }));
    };

    const onProgressRaw = (data: {
      jobId: string;
      fileIndex: number;
      processedRows: number;
      totalFilteredRows: number;
      qualifiedCount: number;
      failedRows: number;
    }) => {
      if (data.jobId !== jobId) return;
      setProgress((prev) => {
        const newMap = new Map(prev.fileProgresses);
        newMap.set(data.fileIndex, {
          processedRows: data.processedRows,
          totalFilteredRows: data.totalFilteredRows,
          qualifiedCount: data.qualifiedCount,
          failedRows: data.failedRows,
        });
        return { ...prev, fileProgresses: newMap };
      });
    };

    const onProgress = throttle(onProgressRaw, 500);

    const onFileStarted = (data: { jobId: string; fileIndex: number }) => {
      if (data.jobId !== jobId) return;
      setProgress((prev) => {
        const newMap = new Map(prev.fileStatuses);
        newMap.set(data.fileIndex, "processing");
        return { ...prev, fileStatuses: newMap };
      });
    };

    const onFileCompleted = (data: {
      jobId: string;
      fileIndex: number;
    }) => {
      if (data.jobId !== jobId) return;
      setProgress((prev) => {
        const newMap = new Map(prev.fileStatuses);
        newMap.set(data.fileIndex, "completed");
        return { ...prev, fileStatuses: newMap };
      });
    };

    const onFileFailed = (data: {
      jobId: string;
      fileIndex: number;
    }) => {
      if (data.jobId !== jobId) return;
      setProgress((prev) => {
        const newMap = new Map(prev.fileStatuses);
        newMap.set(data.fileIndex, "failed");
        return { ...prev, fileStatuses: newMap };
      });
    };

    const onCompleted = (data: {
      jobId: string;
      status?: string;
      totalQualified: number;
      totalFailed: number;
    }) => {
      if (data.jobId !== jobId) return;
      setProgress((prev) => ({
        ...prev,
        status: (data.status as QualificationJob["status"]) || "completed",
        totalQualified: data.totalQualified,
        totalFailed: data.totalFailed,
      }));
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["outbound-leads"] });
    };

    const onFailed = (data: { jobId: string; error: string }) => {
      if (data.jobId !== jobId) return;
      setProgress((prev) => ({
        ...prev,
        status: "failed",
        error: data.error,
      }));
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    };

    socket.on("job:started", onStarted);
    socket.on("job:progress", onProgress);
    socket.on("job:file:started", onFileStarted);
    socket.on("job:file:completed", onFileCompleted);
    socket.on("job:file:failed", onFileFailed);
    socket.on("job:completed", onCompleted);
    socket.on("job:failed", onFailed);

    return () => {
      socket.off("job:started", onStarted);
      socket.off("job:progress", onProgress);
      socket.off("job:file:started", onFileStarted);
      socket.off("job:file:completed", onFileCompleted);
      socket.off("job:file:failed", onFileFailed);
      socket.off("job:completed", onCompleted);
      socket.off("job:failed", onFailed);
    };
  }, [socket, jobId, queryClient]);

  return progress;
}
