﻿using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace LINGYUN.Platform.EntityFrameworkCore
{
    public class PlatformHttpApiHostMigrationsDbContextFactory : IDesignTimeDbContextFactory<PlatformHttpApiHostMigrationsDbContext>
    {
        public PlatformHttpApiHostMigrationsDbContext CreateDbContext(string[] args)
        {
            var configuration = BuildConfiguration();

            var builder = new DbContextOptionsBuilder<PlatformHttpApiHostMigrationsDbContext>()
                .UseMySql(configuration.GetConnectionString("AbpIdentityServer"));

            return new PlatformHttpApiHostMigrationsDbContext(builder.Options);
        }

        private static IConfigurationRoot BuildConfiguration()
        {
            var builder = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.Development.json", optional: false);

            return builder.Build();
        }
    }
}
