yarn && yarn build
rm -rf hs-system-communicate.zip
cp -r ./src/components/functions ./
zip -r hs-system-communicate.zip functions trigger dist manifest.yml
rm -rf ./functions
