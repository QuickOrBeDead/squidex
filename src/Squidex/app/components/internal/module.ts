﻿/*
 * Squidex Headless CMS
 * 
 * @license
 * Copyright (c) Sebastian Stehle. All rights reserved
 */

import * as Ng2 from '@angular/core';

import { SqxFrameworkModule } from 'shared';
import { SqxLayoutModule } from 'components/layout';

import {
    AppAreaComponent,
    AppsPageComponent,
    DashboardComponent,
    InternalAreaComponent
} from './declarations';

@Ng2.NgModule({
    imports: [
        SqxFrameworkModule,
        SqxLayoutModule
    ],
    declarations: [
        AppAreaComponent,
        AppsPageComponent,
        DashboardComponent,
        InternalAreaComponent
    ]
})
export class SqxAppModule { }