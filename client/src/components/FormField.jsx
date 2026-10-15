import { useId } from 'react';

/** Label + input + inline error. Pass as="textarea" or as="select" (with children) for other controls. */
export default function FormField({ label, error, hint, as: Tag = 'input', className = '', children, ...props }) {
  const id = useId();
  return (
    <div className={`field ${error ? 'field-error' : ''} ${className}`}>
      <label htmlFor={id}>{label}</label>
      <Tag id={id} aria-invalid={Boolean(error)} aria-describedby={error || hint ? `${id}-msg` : undefined} {...props}>{children}</Tag>
      {(error || hint) && <small id={`${id}-msg`} className={error ? 'field-msg-error' : 'field-hint'}>{error || hint}</small>}
    </div>
  );
}
