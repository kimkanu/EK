import React from 'react';

import defaultProfileImage from '../../assets/images/img_profile.png';

interface CredentialButtonProps {
  displayName: string;
  email: string;
  profileImage?: string;
  onClick?: React.MouseEventHandler;
  tabIndex?: number;
  last: boolean;
}

// TODO: implement keyboard inputs to support a11y
/* eslint-disable jsx-a11y/click-events-have-key-events */

const CredentialButton: React.FC<CredentialButtonProps> = ({
  displayName,
  email,
  profileImage = defaultProfileImage,
  onClick,
  tabIndex,
  last,
}) => (
  <div
    className={`h-48 ${last ? '' : 'mr-6'} flex flex-col justify-center items-center bg-gray-200 hover:bg-gray-300 rounded-lg cursor-pointer`}
    style={{ width: '9rem' }}
    title={`Log in with the account ${displayName}`}
    onClick={onClick}
    role="button"
    tabIndex={tabIndex}
  >
    <img className="w-24 h-24 mt-2 object-cover rounded-full" src={profileImage} aria-label="Profile image" />
    <div className="h-16 text-center" style={{ width: '9rem' }}>
      <div className="text-lg h-6 mt-4 px-3 leading-4 truncate">{displayName}</div>
      <div className="text-xs px-3 text-gray-600 h-6 truncate">{email}</div>
    </div>
  </div>
);

export default CredentialButton;
