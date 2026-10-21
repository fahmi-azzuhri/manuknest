package id.my.efkode.manuknest;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(BookmarkExportPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
