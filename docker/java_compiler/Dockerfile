# Use specific OpenJDK version
FROM openjdk:11.0.15-jdk

# Set labels for maintainability
LABEL maintainer="Code Testing Platform <your-email@example.com>"
LABEL description="Java compiler image for Code Testing Platform"

# Install additional utilities
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    procps \
    time \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security
RUN groupadd -r coderunner && useradd -r -g coderunner -m coderunner

# Set up working directory for code
WORKDIR /app

# Make the working directory writable by the coderunner user
RUN chown -R coderunner:coderunner /app

# Set default user to non-root for security
USER coderunner

# Set environment variables
ENV LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    DEBIAN_FRONTEND=noninteractive

# Default command - any actual compile command will be passed at runtime
CMD ["javac", "-version"]