# Sử dụng Node.js base image
FROM node:23.3.0

# Thiết lập các ARG từ docker-compose.yml
ARG APP_NAME
ARG WEB_UID
ARG WEB_USER
ARG WEB_GID
ARG WEB_GROUP
ARG WWW_DIR
ARG LOG_DIR

ENV TZ=Asia/Ho_Chi_Minh \
    DEBIAN_FRONTEND=noninteractive \
    APP_NAME=${APP_NAME} \
    WEB_UID=${WEB_UID} \
    WEB_USER=${WEB_USER} \
    WEB_GID=${WEB_GID} \
    WEB_GROUP=${WEB_GROUP} \
    WWW_DIR=${WWW_DIR} \
    LOG_DIR=${LOG_DIR}

ENV HOME=/home/$WEB_USER

# Thiết lập timezone, tạo user, group và thiết lập quyền truy cập
RUN apt-get update --allow-releaseinfo-change --fix-missing 
RUN apt-get install -y tzdata
RUN apt-get install -y htop
RUN ln -fs /usr/share/zoneinfo/$TZ /etc/localtime 
RUN dpkg-reconfigure -f noninteractive tzdata 
RUN groupadd --gid $WEB_GID $WEB_GROUP 
RUN useradd --uid $WEB_UID --gid $WEB_GID -m -d "$HOME" -s /bin/bash $WEB_USER
RUN mkdir -p "$HOME/$APP_NAME"
RUN chown -R $WEB_USER:$WEB_GROUP "$HOME/$APP_NAME"
RUN chmod 775 "$HOME/$APP_NAME"
RUN apt-get clean
RUN rm -rf /var/lib/apt/lists/*

WORKDIR $HOME/$APP_NAME

# Cài đặt các dependencies
COPY package.json ./

# Copy toàn bộ mã nguồn vào container (sẽ bị ghi đè bởi volumes)
COPY . .

RUN npm install

RUN chown -R $WEB_USER:$WEB_GROUP .

# Khởi động ứng dụng
# CMD ["/bin/bash","-c","npm start && npm run schedule"]
RUN chmod +x ./start.sh

# RUN ./start.sh

# Chạy ứng dụng dưới quyền người dùng không phải root
USER $WEB_USER

CMD ["/bin/bash", "./start.sh"]

