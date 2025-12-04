FROM ghcr.io/jodconverter/jodconverter-examples:rest

# Configure server port and LibreOffice pool
ENV SERVER_PORT=8080 \
    JODCONVERTER_LOCAL_PORTNUMBERS=2002,2003 \
    JODCONVERTER_LOCAL_WORKING_DIR=/tmp \
    SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE=20MB \
    SPRING_SERVLET_MULTIPART_MAX_REQUEST_SIZE=20MB

EXPOSE 8080

# The base image defines the default CMD/ENTRYPOINT to start the Spring Boot app
