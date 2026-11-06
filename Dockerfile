FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY Shop.sln ./
COPY src/Shop.Domain/Shop.Domain.csproj src/Shop.Domain/
COPY src/Shop.Application/Shop.Application.csproj src/Shop.Application/
COPY src/Shop.Infrastructure/Shop.Infrastructure.csproj src/Shop.Infrastructure/
COPY src/Shop.Api/Shop.Api.csproj src/Shop.Api/
RUN dotnet restore
COPY src/ src/
RUN dotnet publish src/Shop.Api/Shop.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080 \
    DOTNET_RUNNING_IN_CONTAINER=true
COPY --from=build /app/publish .
RUN mkdir -p /app/wwwroot/uploads/products \
    && chown -R $APP_UID:$APP_UID /app/wwwroot
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "Shop.Api.dll"]