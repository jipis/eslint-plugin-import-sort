#!/bin/bash

DIR="`pwd`/welkjsdoidj"

SUBDIRS="components internal types utils"

if [ -d "$DIR" ] ; then
  echo "Error: Testing dirs directory '$DIR' exists. Please delete it before running tests."
  exit 1
fi

if [ -f "$DIR" ] ; then
  echo "Error: File "$DIR" exists. Please delete it before running tests."
  exit 1
fi

mkdir $DIR
for d in $SUBDIRS; do mkdir $DIR/$d; done
