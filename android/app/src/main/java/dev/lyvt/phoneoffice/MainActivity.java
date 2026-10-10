package dev.lyvt.phoneoffice;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle state) {
        registerPlugin(NotesFolderPlugin.class);
        super.onCreate(state);
    }
}
