#!/bin/bash
RETADDR="$PWD/node_modules/@storycraft"
rm -rf "$RETADDR/node-kakao"
cp -r node-kakao "$RETADDR"
