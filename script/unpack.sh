source ./script/workspace.sh
for PACKAGE in $PACKAGE_LIST; do
  if [ -f packages/$PACKAGE/script/unpack.sh ]; then
    echo packages/$PACKAGE - unpack
    (cd packages/$PACKAGE && bash -c ./script/unpack.sh)
  fi
done
for PROJECT in $DEMO_LIST; do
  echo demo/$PROJECT - unpack
  (cd demo/$PROJECT && bash -c ./script/unpack.sh)
done
