#!/bin/bash
echo -e "---- POSTINSTALL.SH ----\n"
echo "Checkout the node-kakao repo into dev branch: $PWD/node_modules/@storycraft"
RETADDR="$PWD/node_modules/@storycraft"
rm -rf node-kakao
cd /tmp
if [[ -d node-kakao ]]
then
    rm -rf node-kakao
fi
git clone https://github.com/storycraft/node-kakao.git
cd node-kakao
git checkout dev
npm i
npm run build
rm -rf .git
cp -r . "$RETADDR/node-kakao"
cd ..
rm -rf node-kakao
echo -e "\n---- POSTINSTALL.SH ----\n"
