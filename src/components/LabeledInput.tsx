import React from 'react';

interface Props {
  type: 'name' | 'email' | 'password'; // TODO: number input
  name?: string;
  label: string;
  placeholder?: string;
}
const LabeledInput = React.forwardRef<HTMLInputElement, Props>(
  ({
    type, name = type, label, placeholder,
  }, ref) => (
    <label className="block uppercase tracking-wide text-gray-800 text-xs font-bold mb-4" htmlFor={name}>
      {label}
      <input className="appearance-none block w-full bg-gray-200 text-gray-800 border-2 rounded-lg text-base py-2 px-4 mt-1 outline-none focus:border-indigo-400" type={type} name={name} placeholder={placeholder} ref={ref} />
    </label>
  ),
);

export default LabeledInput;
