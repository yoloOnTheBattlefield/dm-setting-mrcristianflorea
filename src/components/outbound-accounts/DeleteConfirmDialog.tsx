import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type OutboundAccount } from "@/hooks/useOutboundAccounts";

interface DeleteConfirmDialogProps {
  deletingAccount: OutboundAccount | null;
  onOpenChange: (open: boolean) => void;
  onDelete: () => Promise<void>;
  isPending: boolean;
}

export default function DeleteConfirmDialog({
  deletingAccount,
  onOpenChange,
  onDelete,
  isPending,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={!!deletingAccount} onOpenChange={(open) => !open && onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Outbound Account</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete @{deletingAccount?.username} from the vault. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
