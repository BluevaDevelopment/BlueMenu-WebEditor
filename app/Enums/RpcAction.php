<?php

namespace App\Enums;

/**
 * Operations the browser asks the plugin to perform.
 * Values are the wire names of the legacy WebSocket protocol, kept so the
 * plugin keeps a single vocabulary across the transport change.
 */
enum RpcAction: string
{
    case MenuList = 'MENU_LIST_REQUEST';
    case MenuGet = 'MENU_GET';
    case MenuSave = 'MENU_SAVE';
    case MenuDelete = 'MENU_DELETE';
    case MenuCreate = 'MENU_CREATE';
}
