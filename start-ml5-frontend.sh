#!/usr/bin/bash
PATH="/home/cyberdom/.nvm/versions/node/v16.18.0/bin:$PATH"
#. /home/cyberdom/.bashrc
source ~/.nvm/nvm.sh
cd ~/faces-ml5
echo "$PWD"
echo "$PATH"
~/.nvm/versions/node/v16.18.0/bin/npm start
#~/.nvm/versions/node/v16.18.0/bin/node ~/faces-ml5/index.js
