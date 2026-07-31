import { formatBytes } from "../lib/validation";

type Props = {
  label: string;
  accept?: string;
  multiple?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
  required?: boolean;
};

export function FilePicker({
  label,
  accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png",
  multiple = false,
  files,
  onChange,
  required,
}: Props) {
  return (
    <div className="file-picker">
      <div className="file-picker-head">
        <span>
          {label}
          {required ? " *" : ""}
        </span>
      </div>
      <label className="file-drop">
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            const list = Array.from(e.target.files ?? []);
            onChange(multiple ? [...files, ...list] : list.slice(0, 1));
            e.target.value = "";
          }}
        />
        <span>Choose file{multiple ? "s" : ""} or drop here</span>
      </label>
      {files.length > 0 ? (
        <ul className="file-list">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.size}-${index}`}>
              <div>
                <strong>{file.name}</strong>
                <span>{formatBytes(file.size)}</span>
              </div>
              <button
                type="button"
                className="linkish"
                onClick={() => onChange(files.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No file selected</p>
      )}
    </div>
  );
}
