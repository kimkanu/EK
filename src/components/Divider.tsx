import React from 'react';

interface Props {
  thickness?: number | string;
}
const Divider: React.FC<Props> = ({ thickness = 2 }) => (
  <div
    className="bg-gray-300 w-full"
    style={{
      height: typeof thickness === 'number' ? `${thickness}px` : thickness,
    }}
  />
);

export default Divider;
