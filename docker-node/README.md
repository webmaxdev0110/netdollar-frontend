# System prerequisites
- Debian 8
- Git

Run `./scripts/prerequisites.sh` to install all other dependencies

# Node deployment 

All settings are generated via sh script and stored in **.core-cfg** file in repository's root directory.
There's also a **.env** file which stores some settings, but those are static and you will probably do not need to change those.

> If you need to regenerate config file delete .core-cfg file or simply clear it's contents. You'll get the prompts on next build

To start any node you first need to generate several keypairs (master key, bank commission key etc). Run `make keypair` to generate those.

### Configuring node

Run `make <gate|validator|agent>` depending on the node type you need and follow the wizard to create a config file. At the end you'll get a message similar to this:

>**************************************************************************
>Node public key [GDQMAICCDQOXRLV2HGCPVBKKIWL5PG4KNFXVVLKJEJ3QKEZVCQGTML4Q]
>**************************************************************************

This public key can be added as validator to other nodes in the network.

### Adding/removing validators

Run `make validator-add <PUBLIC_KEY>` or  `make validator-remove <PUBLIC_KEY>` to add or remove validator respectively.
> **Note:**
If your node is already running, this operation will automatically stop it. Be sure to run `make start` to run a node again

### Starting node

After your node is configured and required validators are added run `make start` to start a node