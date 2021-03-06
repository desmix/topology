import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';

import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { Store } from 'le5le-store';

import { ToolsService } from './tools.service';

@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss'],
  providers: [ToolsService]
})
export class ToolsComponent implements OnInit, OnDestroy {
  @Output() edit = new EventEmitter<any>();

  search = '';
  tab = 1;

  classes: any[];
  sysTools: any[];
  topoTools: any[];

  systemTools: any[] = [];
  userTools: any[] = [];

  search$ = new Subject<string>();
  classes$: any;

  user: any;
  user$: any;
  constructor(private service: ToolsService) {
  }

  async ngOnInit() {
    this.user$ = Store.subscribe('user', (user: any) => {
      this.user = user;
    });

    this.search$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(text => {
        this.onSearch(text);
      });

    this.classes$ = Store.subscribe('app-classes', (classes: any) => {
      this.classes = classes;
      this.classifyTools();
    });

    this.sysTools = await this.service.GetSystemTools();
    this.topoTools = await this.service.GetUserTools();
    this.classifyTools();
  }

  classifyTools() {
    if (!this.classes || !this.sysTools) {
      return;
    }

    this.systemTools = [];
    this.userTools = [];

    for (const c of this.classes) {
      const system = {
        name: c.name,
        list: [],
        expand: true
      };
      const userTools = {
        name: c.name,
        list: [],
        expand: true
      };
      for (const item of this.sysTools) {
        if (item.class === c.name) {
          system.list.push(item);
        }
      }

      for (const item of this.topoTools) {
        if (item.class === c.name) {
          userTools.list.push(item);
        }
      }

      this.systemTools.push(system);
      this.userTools.push(userTools);
    }
  }

  onSearch(text: string) {
    this.filterTools(this.systemTools, text);
    this.filterTools(this.userTools, text);
  }

  filterTools(tools: any[], text: string) {
    for (const group of tools) {
      let found = false;
      for (const item of group.list) {
        item.hidden = false;
        if (!text) {
          found = true;
          continue;
        }
        if (item.name.indexOf(text) > -1 || item.py.indexOf(text) > -1) {
          found = true;
        } else {
          item.hidden = true;
        }
      }

      if (found) {
        group.expand = true;
      } else {
        group.expand = false;
      }
    }
  }

  onDrag(event: DragEvent, node: any) {
    if (node) {
      event.dataTransfer.setData('Text', JSON.stringify(node.componentData || node.data));
    }
  }

  onTouchstart(item: any) {
    // this.canvas.touchedNode = item.data;
  }

  onEditComponent(name: string, id: string = '') {
    this.edit.emit({
      id,
      name
    });
  }

  ngOnDestroy() {
    this.search$.unsubscribe();
    this.classes$.unsubscribe();
    this.user$.unsubscribe();
  }
}
