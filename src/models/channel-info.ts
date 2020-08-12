interface ChannelInfo {
  displayName: string;
  id: string;
  images: string[];
  updatedAt: number;
}

export default ChannelInfo;

export const defaultChannelInfo: ChannelInfo = {
  displayName: '',
  id: '',
  images: [],
  updatedAt: 0,
};
