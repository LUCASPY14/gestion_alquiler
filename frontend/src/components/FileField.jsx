import { field, input, label } from '../ui/styles';

export default function FileField({
  id, name, labelText, onChange, urlActual, textoActual = 'Ver archivo actual',
  accept = '.pdf,.jpg,.jpeg,.png',
}) {
  return (
    <div className={field}>
      <label className={label} htmlFor={id}>{labelText}</label>
      <input
        id={id}
        type="file"
        name={name}
        className={input}
        onChange={onChange}
        accept={accept}
      />
      {urlActual && (
        <a
          href={urlActual}
          target="_blank"
          rel="noreferrer"
          className="mt-1 text-xs font-medium text-accent-600 hover:underline dark:text-accent-400"
        >
          {textoActual}
        </a>
      )}
    </div>
  );
}
