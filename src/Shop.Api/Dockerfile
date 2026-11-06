
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
RUN mkdir -p /app/wwwroot/uploads && chown -R app:app /app/wwwroot
EXPOSE 8080
USER app

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["src/Shop.Api/Shop.Api.csproj", "src/Shop.Api/"]
COPY ["src/Shop.Application/Shop.Application.csproj", "src/Shop.Application/"]
COPY ["src/Shop.Domain/Shop.Domain.csproj", "src/Shop.Domain/"]
COPY ["src/Shop.Infrastructure/Shop.Infrastructure.csproj", "src/Shop.Infrastructure/"]

RUN dotnet restore "./src/Shop.Api/Shop.Api.csproj"

COPY . .
WORKDIR "/src/src/Shop.Api"

RUN dotnet publish "./Shop.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build --chown=app:app /app/publish .
ENTRYPOINT ["dotnet", "Shop.Api.dll"]
