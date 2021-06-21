source ./script/config.sh
for PACKAGE in $PACKAGE_LIST; do
  if [ -f packages/$PACKAGE/script/pack.sh ]; then
    echo packages/$PACKAGE - pack
    (cd packages/$PACKAGE && bash -c ./script/pack.sh)
  fi
done