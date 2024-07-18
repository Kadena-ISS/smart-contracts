docker volume create kadena_devnet
docker run --interactive --tty --publish 8080:8080 --volume kadena_devnet:/data --name devnet kadena/devnet:hyperlane