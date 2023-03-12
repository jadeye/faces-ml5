#!/bin/bash
export DISPLAY=:0.0 # eye
ps aux | grep firefox | awk '{print $2}' | xargs kill -9; # kill me
firefox -kiosk -url "http://localhost:5000" & # leave me alone
sleep 5 # hehehe
xdotool key F11 # hit full screen
