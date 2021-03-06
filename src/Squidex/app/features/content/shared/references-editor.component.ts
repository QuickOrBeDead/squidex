/*
 * Squidex Headless CMS
 *
 * @license
 * Copyright (c) Squidex UG (haftungsbeschränkt). All rights reserved.
 */

// tslint:disable:prefer-for-of

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import {
    AppLanguageDto,
    AppsState,
    ContentDto,
    ContentsService,
    DialogModel,
    ImmutableArray,
    MathHelper,
    SchemaDetailsDto,
    SchemasService,
    Types
} from '@app/shared';

export const SQX_REFERENCES_EDITOR_CONTROL_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ReferencesEditorComponent), multi: true
};

@Component({
    selector: 'sqx-references-editor',
    styleUrls: ['./references-editor.component.scss'],
    templateUrl: './references-editor.component.html',
    providers: [SQX_REFERENCES_EDITOR_CONTROL_VALUE_ACCESSOR],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReferencesEditorComponent implements ControlValueAccessor, OnInit {
    private callChange = (v: any) => { /* NOOP */ };
    private callTouched = () => { /* NOOP */ };

    @Input()
    public schemaId: string;

    @Input()
    public language: AppLanguageDto;

    @Input()
    public languages: ImmutableArray<AppLanguageDto>;

    public selectorDialog = new DialogModel();

    public schema: SchemaDetailsDto;

    public contentItems = ImmutableArray.empty<ContentDto>();

    public isDisabled = false;
    public isInvalidSchema = false;

    constructor(
        private readonly appsState: AppsState,
        private readonly changeDetector: ChangeDetectorRef,
        private readonly contentsService: ContentsService,
        private readonly schemasService: SchemasService
    ) {
    }

    public ngOnInit() {
        if (this.schemaId === MathHelper.EMPTY_GUID) {
            this.isInvalidSchema = true;
            return;
        }

        this.schemasService.getSchema(this.appsState.appName, this.schemaId)
            .subscribe(dto => {
                this.schema = dto;

                this.changeDetector.detectChanges();
            }, () => {
                this.isInvalidSchema = true;

                this.changeDetector.detectChanges();
            });
    }

    public writeValue(obj: any) {
        if (Types.isArrayOfString(obj)) {
            if (!Types.isEquals(obj, this.contentItems.map(x => x.id).values)) {
                const contentIds: string[] = obj;

                this.contentsService.getContents(this.appsState.appName, this.schemaId, 10000, 0, undefined, contentIds)
                    .subscribe(dtos => {
                        this.contentItems = ImmutableArray.of(contentIds.map(id => dtos.items.find(c => c.id === id)).filter(r => !!r).map(r => r!));

                        if (this.contentItems.length !== contentIds.length) {
                            this.updateValue();
                        }

                        this.changeDetector.detectChanges();
                    }, () => {
                        this.contentItems = ImmutableArray.empty();

                        this.changeDetector.detectChanges();
                    });
            }
        } else {
            this.contentItems = ImmutableArray.empty();
        }
    }

    public setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
    }

    public registerOnChange(fn: any) {
        this.callChange = fn;
    }

    public registerOnTouched(fn: any) {
        this.callTouched = fn;
    }

    public select(contents: ContentDto[]) {
        for (let content of contents) {
            this.contentItems = this.contentItems.push(content);
        }

        if (contents.length > 0) {
            this.updateValue();
        }

        this.selectorDialog.hide();
    }

    public remove(content: ContentDto) {
        if (content) {
            this.contentItems = this.contentItems.remove(content);

            this.updateValue();
        }
    }

    public sort(contents: ContentDto[]) {
        if (contents) {
            this.contentItems = ImmutableArray.of(contents);

            this.updateValue();
        }
    }

    private updateValue() {
        let ids: string[] | null = this.contentItems.values.map(x => x.id);

        if (ids.length === 0) {
            ids = null;
        }

        this.callTouched();
        this.callChange(ids);

        this.changeDetector.detectChanges();
    }
}