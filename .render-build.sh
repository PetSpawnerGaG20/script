#!/bin/bash

# 1. Обновляем
apt-get update

# 2. Устанавливаем Lua 5.1 и unzip
apt-get install -y lua5.1 lua5.1-cli lua5.1-dev unzip wget

# 3. Проверяем
lua -v
