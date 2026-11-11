#!/bin/bash
# stack.sh <dir> <out.png> id...
d=$1; o=$2; shift 2; args=(); n=0
for id in "$@"; do [ -f "$d/$id.png" ] || continue; ffmpeg -y -loglevel error -i "$d/$id.png" -vf "pad=iw:ih+26:0:26:0x003366,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='$id':x=8:y=4:fontsize=20:fontcolor=white" "$d/_$id.png"; args+=(-i "$d/_$id.png"); n=$((n+1)); done
if [ $n -gt 1 ]; then ffmpeg -y -loglevel error "${args[@]}" -filter_complex "vstack=inputs=$n" "$o"; else cp "${args[1]}" "$o"; fi
rm -f "$d"/_*.png
