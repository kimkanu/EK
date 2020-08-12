import React from 'react';

interface Props {
  label: string;
  normalClassName?: string;
  disabledClassName?: string;
  hoverClassName?: string;
  textClassName?: string;
  onClick?: React.MouseEventHandler;
  disabled?: boolean;
}
const FullWidthButton: React.FC<Props> = ({
  label,
  disabled = false,
  normalClassName = 'bg-indigo-700',
  disabledClassName = 'bg-gray-400',
  hoverClassName = 'hover:bg-indigo-800',
  textClassName = disabled ? 'text-gray-600' : 'text-gray-900',
  onClick,
}) => (
  <input
    type="submit"
    className={`appearance-none mt-6 block w-full h-12 text-base ${textClassName} ${disabled ? disabledClassName : normalClassName} ${disabled ? '' : hoverClassName} ${disabled ? '' : 'hover:shadow-lg cursor-pointer hover:shadow-lg'} ${textClassName} rounded-lg outline-none focus:outline-none`}
    onClick={onClick}
    value={label}
    disabled={disabled}
  />
);

export default FullWidthButton;
