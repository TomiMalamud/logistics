import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const FormField: React.FC<{
    label: string;
    name?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    disabled?: boolean;
    error?: string;
    isTextarea?: boolean;
    type?: string;
    placeholder?: string;
    children?: React.ReactNode;
  }> = ({ label, name, value, onChange, disabled, error, isTextarea, type, placeholder, children }) => (
    <div>
      <Label>{label}</Label>
      {children || (
        isTextarea ? (
          <Textarea
            name={name}
            value={value}
            onChange={onChange}
            className="mt-1"
            required
            disabled={disabled}
            placeholder={placeholder}
          />
        ) : (
          <Input
            name={name}
            value={value}
            onChange={onChange}
            type={type || "text"}
            className="mt-1"
            required={name !== 'scheduled_date' && name !== 'notes'}
            disabled={disabled}
            placeholder={placeholder}
          />
        )
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {(name === "address" || name === "phone") && (
        <span className="text-sm mt-2 text-gray-500">
          Podés editarlo si no es correcto
        </span>
      )}
    </div>
  );
  
  export default FormField