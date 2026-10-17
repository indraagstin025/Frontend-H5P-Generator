import { CheckIcon } from '@radix-ui/react-icons';

type ToastProps = {
  message: string;
};

export function Toast({ message }: ToastProps) {
  if (!message) return null;
  return (
    <div className="toast" role="status">
      <CheckIcon /> {message}
    </div>
  );
}
