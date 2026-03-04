import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
    selector: 'app-group',
    standalone: true,
    imports: [RouterLink, ButtonModule, CardModule, Sidebar],
    templateUrl: './group.html',
    styleUrl: './group.css'
})
export class Group {
  memberCount: number = 42;
}