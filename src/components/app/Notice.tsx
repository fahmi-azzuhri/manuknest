import { Check, X } from "lucide-react";

type NoticeProps = {
  message: string;
  isError: boolean;
  onClose: () => void;
};

export default function Notice({ message, isError, onClose }: NoticeProps) {
  return (
    <div className={isError ? "notice error" : "notice"} role={isError ? "alert" : "status"}>
      {isError ? <X size={15} /> : <Check size={15} />}
      {message}
      <button onClick={onClose} aria-label="Tutup">
        <X size={14} />
      </button>
    </div>
  );
}
