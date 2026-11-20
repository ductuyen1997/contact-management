# syntax=docker/dockerfile:1.7
# Shared multi-stage build for every Spring Boot module. Select the module with --build-arg MODULE=<name>.

FROM eclipse-temurin:17-jdk AS build
WORKDIR /workspace

# 1) Build descriptors first so dependency downloads are cached between source changes
COPY .mvn/ .mvn/
COPY mvnw pom.xml lombok.config ./
COPY config-server/pom.xml config-server/
COPY discovery-server/pom.xml discovery-server/
COPY api-gateway/pom.xml api-gateway/
COPY contact-service/pom.xml contact-service/
COPY activity-service/pom.xml activity-service/
COPY auth-service/pom.xml auth-service/

# 2) Sources
COPY config-server/src config-server/src
COPY discovery-server/src discovery-server/src
COPY api-gateway/src api-gateway/src
COPY contact-service/src contact-service/src
COPY activity-service/src activity-service/src
COPY auth-service/src auth-service/src

ARG MODULE
RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw -B -q -pl ${MODULE} -am package -DskipTests

# 3) Split the fat jar into layers (dependencies change less often than application code)
RUN java -Djarmode=tools -jar ${MODULE}/target/${MODULE}.jar extract --layers --launcher --destination /layers

FROM eclipse-temurin:17-jre
RUN groupadd --system spring && useradd --system --gid spring spring
WORKDIR /app
COPY --from=build /layers/dependencies/ ./
COPY --from=build /layers/spring-boot-loader/ ./
COPY --from=build /layers/snapshot-dependencies/ ./
COPY --from=build /layers/application/ ./
USER spring
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
