﻿// ==========================================================================
//  Squidex Headless CMS
// ==========================================================================
//  Copyright (c) Squidex UG (haftungsbeschraenkt)
//  All rights reserved. Licensed under the MIT license.
// ==========================================================================

using System;

namespace Squidex.Extensions.Actions
{
    [AttributeUsage(AttributeTargets.Class, Inherited = false)]
    public sealed class RuleActionAttribute : Attribute
    {
        public string ReadMore { get; set; }

        public string IconImage { get; set; }

        public string IconColor { get; set; }

        public string Display { get; set; }

        public string Description { get; set; }
    }
}
