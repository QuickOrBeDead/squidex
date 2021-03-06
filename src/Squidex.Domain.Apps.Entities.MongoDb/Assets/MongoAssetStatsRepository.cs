﻿// ==========================================================================
//  Squidex Headless CMS
// ==========================================================================
//  Copyright (c) Squidex UG (haftungsbeschränkt)
//  All rights reserved. Licensed under the MIT license.
// ==========================================================================

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MongoDB.Driver;
using Squidex.Domain.Apps.Entities.Assets;
using Squidex.Domain.Apps.Entities.Assets.Repositories;
using Squidex.Infrastructure;
using Squidex.Infrastructure.EventSourcing;
using Squidex.Infrastructure.MongoDb;

namespace Squidex.Domain.Apps.Entities.MongoDb.Assets
{
    public partial class MongoAssetStatsRepository : MongoRepositoryBase<MongoAssetStatsEntity>, IAssetStatsRepository, IEventConsumer
    {
        public MongoAssetStatsRepository(IMongoDatabase database)
            : base(database)
        {
        }

        protected override string CollectionName()
        {
            return "Projections_AssetStats";
        }

        protected override Task SetupCollectionAsync(IMongoCollection<MongoAssetStatsEntity> collection, CancellationToken ct = default(CancellationToken))
        {
            return collection.Indexes.CreateManyAsync(
                new[]
                {
                    new CreateIndexModel<MongoAssetStatsEntity>(Index.Ascending(x => x.AssetId).Ascending(x => x.Date)),
                    new CreateIndexModel<MongoAssetStatsEntity>(Index.Ascending(x => x.AssetId).Descending(x => x.Date))
                }, ct);
        }

        public async Task<IReadOnlyList<IAssetStatsEntity>> QueryAsync(Guid appId, DateTime fromDate, DateTime toDate)
        {
            var originalSizesEntities =
                await Collection.Find(x => x.AssetId == appId && x.Date >= fromDate && x.Date <= toDate).SortBy(x => x.Date)
                    .ToListAsync();

            var enrichedSizes = new List<MongoAssetStatsEntity>();

            var sizesDictionary = originalSizesEntities.ToDictionary(x => x.Date);

            var previousSize = long.MinValue;
            var previousCount = long.MinValue;

            for (var date = fromDate; date <= toDate; date = date.AddDays(1))
            {
                var size = sizesDictionary.GetOrDefault(date);

                if (size != null)
                {
                    previousSize = size.TotalSize;
                    previousCount = size.TotalCount;
                }
                else
                {
                    if (previousSize < 0)
                    {
                        var firstBeforeRangeEntity =
                            await Collection.Find(x => x.AssetId == appId && x.Date < fromDate).SortByDescending(x => x.Date)
                                .FirstOrDefaultAsync();

                        previousSize = firstBeforeRangeEntity?.TotalSize ?? 0L;
                        previousCount = firstBeforeRangeEntity?.TotalCount ?? 0L;
                    }

                    size = new MongoAssetStatsEntity
                    {
                        Date = date,
                        TotalSize = previousSize,
                        TotalCount = previousCount
                    };
                }

                enrichedSizes.Add(size);
            }

            return enrichedSizes;
        }

        public async Task<long> GetTotalSizeAsync(Guid appId)
        {
            var totalSizeEntity =
                await Collection.Find(x => x.AssetId == appId).SortByDescending(x => x.Date)
                    .FirstOrDefaultAsync();

            return totalSizeEntity?.TotalSize ?? 0;
        }
    }
}
