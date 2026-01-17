import { inject, Injectable } from '@angular/core';
import { Creator } from '@gurokonekt/models';
import { APP_CONFIG } from '../../../../environments/app-config.token';
import { createClient, EntryCollection, EntrySkeletonType } from 'contentful';

@Injectable({
  providedIn: 'root',
})
export class Contentful {
  private readonly appConfig = inject(APP_CONFIG)
  private cdaClient = createClient({
    space: this.appConfig.CONTENTFUL_SPACE,
    accessToken: this.appConfig.CONTENTFUL_ACCESS_TOKEN,
  });

  public getLeads(query?: object): Promise<Creator[]> {
    return this.cdaClient
      .getEntries(
        Object.assign(
          {
            content_type: 'guruKonekt-creators',
          },
          query
        )
      )
      .then((res) => {
        return this.formatLeads(res);
      });
  }

  private formatLeads(
    event: EntryCollection<EntrySkeletonType, undefined, string>
  ) {
    const items: Creator[] = [];
    event.items.map((entry, index) => {
      const asset = event?.includes?.Asset?.find(
        (asset) =>
          asset.sys.id ===
          (entry?.fields?.['headshotImage'] as { sys: { id: string } })?.sys?.id
      );
      items.push({
        id: index.toString(),
        name: entry.fields['name'] as string,
        image: asset?.fields?.file?.url || '',
      });
    });
    return items;
  }
}
