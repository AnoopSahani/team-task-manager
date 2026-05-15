# =========================================================
# Stage 1: Build the React frontend
# =========================================================
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# =========================================================
# Stage 2: Build the Spring Boot backend (Java 17),
# embedding the frontend's dist/ output as Spring Boot static
# resources so a single JAR serves both the API and the SPA.
# =========================================================
FROM maven:3.9-eclipse-temurin-17 AS backend
WORKDIR /app
COPY backend/pom.xml ./
RUN mvn dependency:go-offline -B
COPY backend/src ./src
COPY --from=frontend /app/dist ./src/main/resources/static
RUN mvn clean package -DskipTests -B

# =========================================================
# Stage 3: Slim Java 17 runtime image
# =========================================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend /app/target/app.jar app.jar
EXPOSE 8080
ENV JAVA_OPTS=""
# Railway injects PORT; Spring Boot reads it from application.properties
CMD ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar app.jar"]
