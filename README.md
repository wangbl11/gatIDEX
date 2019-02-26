# gatIDEX

########## steps to sign and build xpi ##########

0. download web-ext
   https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Getting_started_with_web-ext
1. cd into root folder
1. modify manifest.json, update version:
   "version": "1.0.25"
1. run "web-ext sign --api-key user:14261568:736 --api-secret 8ad0b9bbe6087feaeb176655bb184a1d88591a0be6ad4e182bc62004d85d6d5a"
   (note, user/api-secret is my account which I use speifically for gatIDEX, NO NEED to change)
1. there is a new xpi is created under web-ext-artifacts folder. eg:
   gatidex-1.0.29-an+fx.xpi

########## Trouble Shoots ##########

1. TypeError: Cannot read property 'R_OK' of undefined
   https://github.com/balena-io/balena-cli/issues/712
